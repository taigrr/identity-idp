# frozen_string_literal: true

module Api
  module Stripe
    class WebhooksController < ApplicationController
      skip_before_action :verify_authenticity_token

      def create
        payload = request.body.read
        sig_header = request.env['HTTP_STRIPE_SIGNATURE']

        unless valid_signature?(payload, sig_header)
          render json: { error: 'Invalid signature' }, status: :bad_request
          return
        end

        event = JSON.parse(payload)
        handle_event(event: event)

        render json: { received: true }, status: :ok
      rescue JSON::ParserError
        render json: { error: 'Invalid payload' }, status: :bad_request
      end

      private

      def handle_event(event:)
        return if duplicate_event?(event)

        case event['type']
        when 'identity.verification_session.verified'
          handle_verification_verified(event: event, session: event.dig('data', 'object'))
        when 'identity.verification_session.requires_input'
          handle_verification_requires_input(event: event, session: event.dig('data', 'object'))
        when 'identity.verification_session.canceled'
          handle_verification_requires_input(event: event, session: event.dig('data', 'object'))
        end
      end

      def handle_verification_verified(event:, session:)
        document_capture_session = find_capture_session(session)
        return unless document_capture_session

        response = retrieve_verification_result(session_id: session['id'])
        return unless response.is_a?(DocAuth::Response)

        store_result(document_capture_session:, response:, event:)
      end

      def handle_verification_requires_input(event:, session:)
        document_capture_session = find_capture_session(session)
        return unless document_capture_session

        response = retrieve_verification_result(session_id: session['id'])
        return unless response.is_a?(DocAuth::Response)

        store_result(document_capture_session:, response:, event:)
      end

      def find_capture_session(session)
        DocumentCaptureSession.find_by(
          stripe_verification_session_id: session['id'],
        )
      end

      def duplicate_event?(event)
        event_id = event['id']
        return false if event_id.blank?

        DocumentCaptureSession.exists?(stripe_last_event_id: event_id)
      end

      def retrieve_verification_result(session_id:)
        DocAuth::Stripe::Requests::RetrieveVerificationSessionRequest.new(
          session_id: session_id,
        ).fetch
      end

      def store_result(document_capture_session:, response:, event:)
        document_capture_session.store_result_from_response(
          response,
          attempt: doc_auth_attempt_count(document_capture_session),
        )
        document_capture_session.update!(stripe_last_event_id: event['id'])
      end

      def doc_auth_attempt_count(document_capture_session)
        RateLimiter.new(
          user: document_capture_session.user,
          rate_limit_type: :idv_doc_auth,
        ).attempts
      end

      def valid_signature?(payload, sig_header)
        return false if sig_header.blank?

        webhook_secret = IdentityConfig.store.stripe_identity_webhook_secret
        return false if webhook_secret.blank?

        parts = sig_header.split(',').each_with_object({}) do |part, hash|
          key, value = part.split('=', 2)
          hash[key] ||= []
          hash[key] << value
        end

        timestamp = parts['t']&.first
        signatures = parts['v1'] || []
        return false unless timestamp && signatures.any?
        timestamp_i = Integer(timestamp, exception: false)
        return false unless timestamp_i
        return false if (Time.zone.now.to_i - timestamp_i).abs > 5.minutes.to_i

        signed_payload = "#{timestamp}.#{payload}"
        expected = OpenSSL::HMAC.hexdigest(
          'SHA256',
          webhook_secret,
          signed_payload,
        )

        signatures.any? do |signature|
          ActiveSupport::SecurityUtils.secure_compare(expected, signature)
        end
      end
    end
  end
end
