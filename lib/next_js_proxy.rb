# frozen_string_literal: true

require 'net/http'

# NextJsProxy proxies specific API routes to the Next.js application.
# This enables gradual migration from Rails to Next.js using the Strangler Fig pattern.
#
# Configuration:
#   - NEXT_JS_URL: Base URL of the Next.js app (default: http://localhost:3001)
#   - NEXT_JS_PROXY_ENABLED: Set to 'true' to enable proxying
#   - NEXT_JS_PROXY_ROUTES: Comma-separated list of route prefixes to proxy
#
# Example:
#   NEXT_JS_URL=http://localhost:3001
#   NEXT_JS_PROXY_ENABLED=true
#   NEXT_JS_PROXY_ROUTES=/api/country-support,/api/openid-connect/certs
#
class NextJsProxy
  # Default routes to proxy when enabled
  DEFAULT_PROXY_ROUTES = [
    '/api/country-support',
    '/api/openid-connect/certs',
    '/api/health',
    '/api/health/database',
    # OIDC routes - uncomment when database integration is ready
    # '/api/openid-connect/userinfo',
    # '/api/openid-connect/token',
  ].freeze

  # Headers that should not be forwarded to the backend
  HOP_BY_HOP_HEADERS = %w[
    connection
    keep-alive
    proxy-authenticate
    proxy-authorization
    te
    trailers
    transfer-encoding
    upgrade
  ].freeze

  def initialize(app)
    @app = app
    @next_js_url = ENV.fetch('NEXT_JS_URL', 'http://localhost:3001')
    @enabled = ENV.fetch('NEXT_JS_PROXY_ENABLED', 'false') == 'true'
    @proxy_routes = parse_proxy_routes
  end

  def call(env)
    return @app.call(env) unless @enabled

    request = Rack::Request.new(env)
    path = request.path_info

    if should_proxy?(path)
      proxy_request(env, path)
    else
      @app.call(env)
    end
  end

  private

  def parse_proxy_routes
    env_routes = ENV['NEXT_JS_PROXY_ROUTES']
    if env_routes.present?
      env_routes.split(',').map(&:strip)
    else
      DEFAULT_PROXY_ROUTES
    end
  end

  def should_proxy?(path)
    @proxy_routes.any? { |route| path.start_with?(route) }
  end

  def proxy_request(env, path)
    request = Rack::Request.new(env)

    uri = URI.parse("#{@next_js_url}#{path}")
    uri.query = request.query_string if request.query_string.present?

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = (uri.scheme == 'https')
    http.open_timeout = 5
    http.read_timeout = 30

    http_request = build_http_request(request, uri)
    copy_request_headers(env, http_request)

    begin
      response = http.request(http_request)
      build_rack_response(response)
    rescue StandardError => e
      Rails.logger.error("NextJsProxy error: #{e.message}")
      # Fall back to Rails if Next.js is unavailable
      @app.call(env)
    end
  end

  def build_http_request(request, uri)
    case request.request_method
    when 'GET'
      Net::HTTP::Get.new(uri)
    when 'POST'
      req = Net::HTTP::Post.new(uri)
      req.body = request.body.read
      request.body.rewind
      req
    when 'PUT'
      req = Net::HTTP::Put.new(uri)
      req.body = request.body.read
      request.body.rewind
      req
    when 'PATCH'
      req = Net::HTTP::Patch.new(uri)
      req.body = request.body.read
      request.body.rewind
      req
    when 'DELETE'
      Net::HTTP::Delete.new(uri)
    when 'OPTIONS'
      Net::HTTP::Options.new(uri)
    when 'HEAD'
      Net::HTTP::Head.new(uri)
    else
      Net::HTTP::Get.new(uri)
    end
  end

  def copy_request_headers(env, http_request)
    env.each do |key, value|
      next unless key.start_with?('HTTP_')
      next if key == 'HTTP_HOST'

      header_name = key.sub('HTTP_', '').split('_').map(&:capitalize).join('-')
      next if HOP_BY_HOP_HEADERS.include?(header_name.downcase)

      http_request[header_name] = value
    end

    # Forward content type and length for POST/PUT requests
    http_request['Content-Type'] = env['CONTENT_TYPE'] if env['CONTENT_TYPE']
    http_request['Content-Length'] = env['CONTENT_LENGTH'] if env['CONTENT_LENGTH']
  end

  def build_rack_response(response)
    status = response.code.to_i
    headers = {}

    response.each_header do |key, value|
      next if HOP_BY_HOP_HEADERS.include?(key.downcase)
      headers[key] = value
    end

    # Remove content-length if body might be different
    headers.delete('content-length')
    headers.delete('Content-Length')

    body = response.body || ''
    headers['Content-Length'] = body.bytesize.to_s

    [status, headers, [body]]
  end
end
