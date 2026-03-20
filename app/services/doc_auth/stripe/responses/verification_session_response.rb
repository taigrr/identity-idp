# frozen_string_literal: true

module DocAuth
  module Stripe
    module Responses
      class VerificationSessionResponse < DocAuth::Response
        attr_reader :http_response

        DATA_PATHS = {
          id: %w[id],
          status: %w[status],
          last_error_code: %w[last_error code],
          last_error_reason: %w[last_error reason],
          first_name: %w[verified_outputs first_name],
          last_name: %w[verified_outputs last_name],
          dob_day: %w[verified_outputs dob day],
          dob_month: %w[verified_outputs dob month],
          dob_year: %w[verified_outputs dob year],
          address_line1: %w[verified_outputs address line1],
          address_line2: %w[verified_outputs address line2],
          address_city: %w[verified_outputs address city],
          address_state: %w[verified_outputs address state],
          address_postal_code: %w[verified_outputs address postal_code],
          address_country: %w[verified_outputs address country],
          id_number_type: %w[verified_outputs id_number type],
          id_number_last4: %w[verified_outputs id_number last4],
          document_status: %w[last_verification_report document status],
          document_type: %w[last_verification_report document type],
          document_issuing_country: %w[last_verification_report document issuing_country],
          document_number: %w[last_verification_report document number],
          document_expiration_date: %w[last_verification_report document expiration_date],
          document_issued_date: %w[last_verification_report document issued_date],
          selfie_status: %w[last_verification_report selfie status],
        }.freeze

        def initialize(http_response:)
          @http_response = http_response
          @pii_from_doc = read_pii

          super(
            success: doc_auth_success?,
            errors: error_messages,
            pii_from_doc:,
            extra: extra_attributes,
          )
        rescue StandardError => e
          NewRelic::Agent.notice_error(e)
          super(
            success: false,
            errors: { network: true },
            exception: e,
            extra: { backtrace: e.backtrace },
          )
        end

        def doc_auth_success?
          verified? && document_verified? && !selfie_failed?
        end

        def selfie_status
          status = get_data(DATA_PATHS[:selfie_status])
          case status
          when 'verified'
            :success
          when 'unverified'
            :fail
          else
            :not_processed
          end
        end

        def liveness_enabled
          selfie_status != :not_processed
        end

        def extra_attributes
          {
            address_line2_present: get_data(DATA_PATHS[:address_line2]).present?,
            birth_year: dob&.year,
            doc_auth_success: doc_auth_success?,
            document_type: get_data(DATA_PATHS[:document_type]),
            liveness_enabled:,
            reference_id: get_data(DATA_PATHS[:id]),
            state: get_data(DATA_PATHS[:address_state]),
            vendor: 'Stripe',
            vendor_status: get_data(DATA_PATHS[:status]),
            vendor_status_message: last_error_reason,
          }
        end

        private

        def verified?
          get_data(DATA_PATHS[:status]) == 'verified'
        end

        def document_verified?
          get_data(DATA_PATHS[:document_status]) == 'verified'
        end

        def selfie_failed?
          get_data(DATA_PATHS[:selfie_status]) == 'unverified'
        end

        def last_error_reason
          get_data(DATA_PATHS[:last_error_reason])
        end

        def error_messages
          if !verified?
            error_code = get_data(DATA_PATHS[:last_error_code])
            case error_code
            when 'document_expired'
              { general: [DocAuth::Errors::DOCUMENT_EXPIRED_CHECK] }
            when 'document_type_not_supported'
              { unaccepted_id_type: true }
            when 'document_unverified_other'
              { general: [DocAuth::Errors::ID_NOT_VERIFIED] }
            when 'selfie_document_missing_photo'
              { general: [DocAuth::Errors::SELFIE_FAILURE] }
            when 'selfie_face_mismatch'
              { selfie_fail: true }
            when 'selfie_manipulated'
              { selfie_fail: true }
            when 'selfie_unverified_other'
              { selfie_fail: true }
            else
              { general: [DocAuth::Errors::GENERAL_ERROR] }
            end
          else
            {}
          end
        end

        def read_pii
          doc_type = get_data(DATA_PATHS[:document_type])

          if doc_type == 'passport'
            Pii::Passport.new(
              first_name: get_data(DATA_PATHS[:first_name]),
              middle_name: nil,
              last_name: get_data(DATA_PATHS[:last_name]),
              dob:,
              mrz: nil,
              issuing_country_code: get_data(DATA_PATHS[:document_issuing_country]),
              nationality_code: get_data(DATA_PATHS[:document_issuing_country]),
              document_number: get_data(DATA_PATHS[:document_number]),
              document_type_received: Idp::Constants::DocumentTypes::PASSPORT,
              passport_expiration: parse_stripe_date(
                get_data(DATA_PATHS[:document_expiration_date]),
              ),
              sex: nil,
              birth_place: nil,
              passport_issued: parse_stripe_date(
                get_data(DATA_PATHS[:document_issued_date]),
              ),
            )
          else
            Pii::StateId.new(
              first_name: get_data(DATA_PATHS[:first_name]),
              middle_name: nil,
              last_name: get_data(DATA_PATHS[:last_name]),
              name_suffix: nil,
              address1: get_data(DATA_PATHS[:address_line1]),
              address2: get_data(DATA_PATHS[:address_line2]),
              city: get_data(DATA_PATHS[:address_city]),
              state: get_data(DATA_PATHS[:address_state]),
              zipcode: get_data(DATA_PATHS[:address_postal_code]),
              dob:,
              sex: nil,
              height: nil,
              weight: nil,
              eye_color: nil,
              state_id_number: get_data(DATA_PATHS[:document_number]),
              state_id_issued: parse_stripe_date(
                get_data(DATA_PATHS[:document_issued_date]),
              ),
              state_id_expiration: parse_stripe_date(
                get_data(DATA_PATHS[:document_expiration_date]),
              ),
              document_type_received: Idp::Constants::DocumentTypes::DRIVERS_LICENSE,
              state_id_jurisdiction: get_data(DATA_PATHS[:address_state]),
              issuing_country_code: get_data(DATA_PATHS[:document_issuing_country]),
            )
          end
        end

        def dob
          year = get_data(DATA_PATHS[:dob_year])
          month = get_data(DATA_PATHS[:dob_month])
          day = get_data(DATA_PATHS[:dob_day])
          return nil unless year && month && day

          Date.new(year.to_i, month.to_i, day.to_i)
        rescue ArgumentError
          nil
        end

        def get_data(path)
          parsed_response_body.dig(*path)
        end

        def parsed_response_body
          @parsed_response_body ||= begin
            http_response&.body.present? ? JSON.parse(
              http_response.body,
            ).with_indifferent_access : {}
          rescue JSON::JSONError
            {}
          end
        end

        def parse_stripe_date(date_hash)
          return nil unless date_hash.is_a?(Hash)

          year = date_hash['year'] || date_hash[:year]
          month = date_hash['month'] || date_hash[:month]
          day = date_hash['day'] || date_hash[:day]
          return nil unless year && month && day

          Date.new(year.to_i, month.to_i, day.to_i)
        rescue ArgumentError
          nil
        end
      end
    end
  end
end
