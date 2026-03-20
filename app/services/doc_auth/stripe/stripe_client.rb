# frozen_string_literal: true

module DocAuth
  module Stripe
    class StripeClient
      attr_reader :config

      def initialize(**config)
        @config = config.freeze
      end

      def post_images(
        front_image: nil,
        back_image: nil,
        passport_image: nil,
        document_type_requested: nil,
        selfie_image: nil,
        image_source: nil,
        images_cropped: false,
        user_uuid: nil,
        uuid_prefix: nil,
        liveness_checking_required: false,
        passport_requested: false
      )
        session_response = create_verification_session(
          customer_user_id: user_uuid,
          liveness_checking_required: liveness_checking_required,
          passport_requested: passport_requested,
        )

        unless session_response.is_a?(Hash) && session_response[:id]
          return DocAuth::Response.new(
            success: false,
            errors: { network: true },
            extra: { vendor: 'Stripe' },
          )
        end

        result = retrieve_verification_result(session_id: session_response[:id])
        return result if result.is_a?(DocAuth::Response)

        DocAuth::Response.new(
          success: false,
          errors: { network: true },
          extra: { vendor: 'Stripe' },
        )
      end

      private

      def create_verification_session(
        customer_user_id:,
        liveness_checking_required:,
        passport_requested:
      )
        Requests::CreateVerificationSessionRequest.new(
          customer_user_id: customer_user_id,
          language: I18n.locale,
          liveness_checking_required: liveness_checking_required,
          passport_requested: passport_requested,
        ).fetch
      end

      def retrieve_verification_result(session_id:)
        Requests::RetrieveVerificationSessionRequest.new(
          session_id: session_id,
        ).fetch
      end
    end
  end
end
