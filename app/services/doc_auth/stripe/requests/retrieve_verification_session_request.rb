# frozen_string_literal: true

module DocAuth
  module Stripe
    module Requests
      class RetrieveVerificationSessionRequest < DocAuth::Stripe::Request
        attr_reader :session_id

        def initialize(session_id:)
          @session_id = session_id
        end

        private

        def handle_http_response(http_response)
          DocAuth::Stripe::Responses::VerificationSessionResponse.new(
            http_response: http_response,
          )
        end

        def handle_connection_error(exception:, status: nil, status_message: nil, reference_id: nil)
          DocAuth::Response.new(**super)
        end

        def method
          :get
        end

        def url
          "#{IdentityConfig.store.stripe_identity_base_url}/v1/identity/verification_sessions/#{session_id}?expand[]=verified_outputs&expand[]=last_verification_report"
        end

        def metric_name
          'stripe_identity_retrieve_session'
        end
      end
    end
  end
end
