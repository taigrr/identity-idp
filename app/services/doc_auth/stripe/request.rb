# frozen_string_literal: true

module DocAuth
  module Stripe
    class Request
      def fetch
        http_response = send_http_request
        if http_response&.success? && http_response.body.length > 0
          handle_http_response(http_response)
        else
          handle_invalid_response(http_response)
        end
      rescue Faraday::ConnectionFailed, Faraday::TimeoutError, Faraday::SSLError => e
        handle_connection_error(exception: e)
      end

      def metric_name
        raise NotImplementedError
      end

      private

      def send_http_request
        case method.downcase.to_sym
        when :post
          send_http_post_request
        when :get
          send_http_get_request
        end
      end

      def handle_http_response(_response)
        raise NotImplementedError
      end

      def handle_invalid_response(http_response)
        message = [
          self.class.name,
          'Unexpected HTTP response',
          http_response&.status,
        ].join(' ')
        exception = DocAuth::RequestError.new(message, http_response&.status)

        response_body = begin
          http_response&.body.present? ? JSON.parse(http_response.body) : {}
        rescue JSON::JSONError
          {}
        end
        handle_connection_error(
          exception: exception,
          status: response_body.dig('error', 'type'),
          status_message: response_body.dig('error', 'message'),
          reference_id: response_body.dig('id'),
        )
      end

      def handle_connection_error(exception:, status: nil, status_message: nil,
                                  reference_id: nil)
        NewRelic::Agent.notice_error(exception)
        {
          success: false,
          errors: { network: true },
          exception: exception,
          extra: {
            vendor: 'Stripe',
            vendor_status: status,
            vendor_status_message: status_message,
            reference_id:,
          }.compact,
        }
      end

      def send_http_get_request
        faraday_connection.get do |req|
          req.options.context = { service_name: metric_name }
        end
      end

      def send_http_post_request
        faraday_connection.post do |req|
          req.options.context = { service_name: metric_name }
          req.body = body
        end
      end

      def faraday_connection
        retry_options = {
          max: 2,
          interval: 0.05,
          interval_randomness: 0.5,
          backoff_factor: 2,
          retry_statuses: [500, 502, 503],
          retry_block: lambda do |env:, options:, retry_count:, exception:, will_retry_in:|
            NewRelic::Agent.notice_error(exception, custom_params: { retry: retry_count })
          end,
        }

        Faraday.new(url: url.to_s, headers: request_headers) do |conn|
          conn.request :retry, retry_options
          conn.request :instrumentation, name: 'request_metric.faraday'
          conn.adapter :net_http
          conn.options.timeout = timeout
        end
      end

      def method
        :post
      end

      def url
        raise NotImplementedError
      end

      def content_type
        'application/x-www-form-urlencoded'
      end

      def request_headers
        {
          'Content-Type': content_type,
          Authorization: "Bearer #{IdentityConfig.store.stripe_identity_api_key}",
        }
      end

      def timeout
        60
      end
    end
  end
end
