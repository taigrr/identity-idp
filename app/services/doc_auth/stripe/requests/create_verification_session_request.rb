# frozen_string_literal: true

module DocAuth
  module Stripe
    module Requests
      class CreateVerificationSessionRequest < DocAuth::Stripe::Request
        attr_reader :customer_user_id, :language,
                    :liveness_checking_required, :passport_requested, :return_url

        def initialize(
          customer_user_id:,
          language:,
          return_url: nil,
          liveness_checking_required: false,
          passport_requested: false
        )
          @customer_user_id = customer_user_id
          @language = language
          @return_url = return_url
          @liveness_checking_required = liveness_checking_required
          @passport_requested = passport_requested
        end

        def body
          params = {
            type: 'document',
            metadata: {
              customer_user_id: customer_user_id,
            },
          }
          params[:return_url] = return_url if return_url.present?

          if liveness_checking_required
            params[:options] = {
              document: {
                require_matching_selfie: true,
              },
            }
          end

          URI.encode_www_form(flatten_params(params))
        end

        private

        def handle_http_response(http_response)
          JSON.parse(http_response.body, symbolize_names: true)
        end

        def url
          "#{IdentityConfig.store.stripe_identity_base_url}/v1/identity/verification_sessions"
        end

        def metric_name
          'stripe_identity_create_session'
        end

        def flatten_params(hash, prefix = nil)
          hash.each_with_object([]) do |(key, value), result|
            prefixed_key = prefix ? "#{prefix}[#{key}]" : key.to_s
            if value.is_a?(Hash)
              result.concat(flatten_params(value, prefixed_key))
            else
              result << [prefixed_key, value.to_s]
            end
          end
        end
      end
    end
  end
end
