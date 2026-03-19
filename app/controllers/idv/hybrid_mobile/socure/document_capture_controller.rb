# frozen_string_literal: true

module Idv
  module HybridMobile
    module Socure
      class DocumentCaptureController < ApplicationController
        include AvailabilityConcern
        include DocumentCaptureConcern
        include Idv::HybridMobile::HybridMobileConcern
        include RenderConditionConcern
        include SocureErrorsConcern
        include DocAuthVendorConcern

        check_or_render_not_found -> do
          IdentityConfig.store.stripe_identity_api_key.present? &&
            IdentityConfig.store.stripe_identity_base_url.present?
        end
        before_action :check_valid_document_capture_session
        before_action :ensure_choose_id_type_completed, only: :show
        before_action :validate_step_not_completed, only: [:show]
        before_action -> do
          update_doc_auth_vendor(user: document_capture_user)
        end, only: :show
        before_action -> do
          redirect_to_correct_vendor(Idp::Constants::Vendors::STRIPE, in_hybrid_mobile: true)
        end, only: :show

        def show
          if rate_limiter.limited?
            redirect_to idv_hybrid_mobile_capture_complete_url
          end

          analytics.idv_doc_auth_document_capture_visited(**analytics_arguments)
          session[:stripe_docv_wait_polling_started_at] = nil

          Funnel::DocAuth::RegisterStep.new(document_capture_user.id, sp_session[:issuer])
            .call('hybrid_mobile_stripe_document_capture', :view, true)

          @selfie_check_required = resolved_authn_context_result.facial_match?
          @hybrid_flow = true
          @passport_requested = document_capture_session.passport_requested?
          document_request = DocAuth::Stripe::Requests::CreateVerificationSessionRequest.new(
            customer_user_id: document_capture_user&.uuid,
            language: I18n.locale,
            return_url: idv_hybrid_mobile_stripe_document_capture_update_url,
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
              flow_path: 'hybrid',
              vendor: 'Stripe',
              errors: { general: ['url_not_found'] },
            )
            redirect_to idv_session_errors_warning_url(flow: 'hybrid')
            return
          end

          document_capture_session.update!(
            stripe_verification_session_id: session_id,
            stripe_last_event_id: nil,
          )
        end

        def update
          return if wait_for_result?

          result = handle_stored_result(
            user: document_capture_session.user,
            store_in_session: false,
          )
          # TODO: new analytics event?
          analytics.idv_doc_auth_document_capture_submitted(
            **result.to_h.merge(analytics_arguments),
          )

          if result.success? || rate_limiter.limited?
            redirect_to idv_hybrid_mobile_capture_complete_url
          else
            redirect_to idv_session_errors_warning_url(flow: 'hybrid')
          end
        end

        def errors
          result = handle_stored_result(
            user: document_capture_user,
            store_in_session: false,
          )
          @presenter = socure_errors_presenter(result)
        end

        private

        def validate_step_not_completed
          return if stored_result.blank? || !stored_result.success? || !selfie_requirement_met?

          redirect_to idv_hybrid_mobile_capture_complete_url
        end

        def socure_errors_presenter(result)
          SocureErrorPresenter.new(
            error_code: error_code_for(result),
            remaining_attempts:,
            sp_name: decorated_sp_session&.sp_name || APP_NAME,
            issuer: decorated_sp_session&.sp_issuer,
            flow_path: :hybrid,
          )
        end

        def wait_for_result?
          document_capture_session.reload unless document_capture_session.result_id
          return false if document_capture_session.load_result.present?

          # If the stored_result is nil, the job fetching the results has not completed.
          analytics.idv_doc_auth_document_capture_polling_wait_visited(**analytics_arguments)

          if document_capture_session.stripe_verification_session_id.blank?
            redirect_to idv_session_errors_warning_url(flow: 'hybrid')
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
            redirect_to idv_session_errors_warning_url(flow: 'hybrid')
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
            flow_path: 'hybrid',
            step: 'stripe_document_capture',
            analytics_id: 'Doc Auth',
            liveness_checking_required: resolved_authn_context_result.facial_match?,
            selfie_check_required: resolved_authn_context_result.facial_match?,
            pii_like_keypaths: [[:pii]],
          }
        end

        def terminal_stripe_response?(result)
          return false unless result.is_a?(DocAuth::Response)
          return false if result.network_error?

          %w[verified requires_input canceled].include?(result.extra[:vendor_status].to_s)
        end

        def rate_limiter
          @rate_limiter ||= RateLimiter.new(
            user: document_capture_user,
            rate_limit_type: :idv_doc_auth,
          )
        end
      end
    end
  end
end
