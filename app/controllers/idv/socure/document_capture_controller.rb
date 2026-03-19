# frozen_string_literal: true

module Idv
  module Socure
    class DocumentCaptureController < ApplicationController
      include Idv::AvailabilityConcern
      include IdvStepConcern
      include DocumentCaptureConcern
      include RenderConditionConcern
      include DocAuthVendorConcern

      check_or_render_not_found -> do
        IdentityConfig.store.stripe_identity_api_key.present? &&
          IdentityConfig.store.stripe_identity_base_url.present?
      end

      before_action :confirm_not_rate_limited, except: :update
      before_action -> do
        confirm_not_rate_limited(check_last_submission: true)
      end, only: :update

      before_action :confirm_step_allowed
      before_action :update_doc_auth_vendor, only: :show
      before_action -> do
        redirect_to_correct_vendor(Idp::Constants::Vendors::STRIPE, in_hybrid_mobile: false)
      end, only: :show

      def show
        analytics.idv_doc_auth_document_capture_visited(**analytics_arguments)
        session[:stripe_docv_wait_polling_started_at] = nil

        Funnel::DocAuth::RegisterStep.new(current_user.id, sp_session[:issuer])
          .call('stripe_document_capture', :view, true)

        @selfie_check_required = resolved_authn_context_result.facial_match?
        @hybrid_flow = false
        @passport_requested = document_capture_session.passport_requested?
        document_request = DocAuth::Stripe::Requests::CreateVerificationSessionRequest.new(
          customer_user_id: current_user.uuid,
          language: I18n.locale,
          return_url: idv_stripe_document_capture_update_url,
          liveness_checking_required: resolved_authn_context_result.facial_match?,
          passport_requested: document_capture_session.passport_requested?,
        )
        timer = JobHelpers::Timer.new
        document_response = timer.time('vendor_request') do
          document_request.fetch
        end

        @url = document_response[:url]
        session_id = document_response[:id]

        if @url.nil? || session_id.nil?
          analytics.idv_doc_auth_network_error(
            submit_attempts: 0,
            remaining_submit_attempts: 0,
            flow_path: flow_path,
            vendor: 'Stripe',
            errors: { general: ['url_not_found'] },
          )
          redirect_to idv_session_errors_warning_url(flow: flow_path)
          return
        end

        document_capture_session.update!(
          stripe_verification_session_id: session_id,
          stripe_last_event_id: nil,
        )
      end

      def update
        return if wait_for_result?

        clear_future_steps!
        idv_session.redo_document_capture = nil # done with this redo
        # Not used in standard flow, here for data consistency with hybrid flow.
        document_capture_session.confirm_ocr

        result = handle_stored_result
        # TODO: new analytics event?
        analytics.idv_doc_auth_document_capture_submitted(**result.to_h.merge(analytics_arguments))

        Funnel::DocAuth::RegisterStep.new(current_user.id, sp_session[:issuer])
          .call('stripe_document_capture', :update, true)

        if result.success?
          redirect_to idv_ssn_url
        else
          redirect_to idv_session_errors_warning_url(flow: flow_path)
        end
      end

      def self.step_info
        Idv::StepInfo.new(
          key: :socure_document_capture,
          controller: self,
          next_steps: [:ssn, :ipp_ssn],
          preconditions: ->(idv_session:, user:) {
            idv_session.flow_path == 'standard' && (
                # mobile
                idv_session.skip_hybrid_handoff ||
                idv_session.desktop_test_mode_enabled?)
          },
          undo_step: ->(idv_session:, user:) do
            idv_session.pii_from_doc = nil
            idv_session.socure_docv_wait_polling_started_at = nil
            idv_session.invalidate_in_person_pii_from_user!
            idv_session.doc_auth_vendor = nil
            idv_session.source_check_vendor = nil
            idv_session.aamva_verified_attributes = nil
          end,
        )
      end

      private

      def wait_for_result?
        document_capture_session.reload unless document_capture_session.result_id
        return false if document_capture_session.load_result.present?

        # If the stored_result is nil, the job fetching the results has not completed.
        analytics.idv_doc_auth_document_capture_polling_wait_visited(**analytics_arguments)

        if document_capture_session.stripe_verification_session_id.blank?
          redirect_to idv_session_errors_warning_url(flow: flow_path)
          return true
        end

        result = DocAuth::Stripe::Requests::RetrieveVerificationSessionRequest.new(
          session_id: document_capture_session.stripe_verification_session_id,
        ).fetch

        if terminal_stripe_response?(result)
          document_capture_session.store_result_from_response(
            result,
            attempt: rate_limiter.attempts,
          )
          document_capture_session.reload
          return false if document_capture_session.load_result.present?
        end

        if wait_timed_out?
          redirect_to idv_session_errors_warning_url(flow: flow_path)
        else
          @refresh_interval = 5
          render 'idv/socure/document_capture/wait'
        end

        true
      end

      def wait_timed_out?
        if session[:stripe_docv_wait_polling_started_at].nil?
          session[:stripe_docv_wait_polling_started_at] = Time.zone.now.to_s
          return false
        end
        start = DateTime.parse(session[:stripe_docv_wait_polling_started_at])
        timeout_period = 2.minutes
        start + timeout_period < Time.zone.now
      end

      def analytics_arguments
        {
          flow_path: flow_path,
          step: 'stripe_document_capture',
          analytics_id: 'Doc Auth',
          redo_document_capture: idv_session.redo_document_capture,
          skip_hybrid_handoff: idv_session.skip_hybrid_handoff,
          liveness_checking_required: resolved_authn_context_result.facial_match?,
          selfie_check_required: resolved_authn_context_result.facial_match?,
          pii_like_keypaths: [[:pii]],
        }.merge(ab_test_analytics_buckets)
      end

      def terminal_stripe_response?(result)
        return false unless result.is_a?(DocAuth::Response)
        return false if result.network_error?

        %w[verified requires_input canceled].include?(result.extra[:vendor_status].to_s)
      end
    end
  end
end
