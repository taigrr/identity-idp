# frozen_string_literal: true

require 'rails_helper'

RSpec.describe NextJsProxy do
  let(:app) { ->(env) { [200, { 'Content-Type' => 'text/plain' }, ['Rails response']] } }
  let(:middleware) { described_class.new(app) }

  before do
    allow(ENV).to receive(:fetch).and_call_original
  end

  describe 'when disabled' do
    before do
      allow(ENV).to receive(:fetch).with('NEXT_JS_PROXY_ENABLED', 'false').and_return('false')
      allow(ENV).to receive(:fetch).with('NEXT_JS_URL', anything).and_return('http://localhost:3001')
      allow(ENV).to receive(:[]).with('NEXT_JS_PROXY_ROUTES').and_return(nil)
    end

    it 'passes requests through to Rails' do
      env = Rack::MockRequest.env_for('/api/country-support')
      status, _headers, body = middleware.call(env)

      expect(status).to eq(200)
      expect(body).to eq(['Rails response'])
    end
  end

  describe 'when enabled' do
    before do
      allow(ENV).to receive(:fetch).with('NEXT_JS_PROXY_ENABLED', 'false').and_return('true')
      allow(ENV).to receive(:fetch).with('NEXT_JS_URL', anything).and_return('http://localhost:3001')
      allow(ENV).to receive(:[]).with('NEXT_JS_PROXY_ROUTES').and_return(nil)
    end

    describe 'for proxied routes' do
      let(:mock_response) do
        instance_double(
          Net::HTTPResponse,
          code: '200',
          body: '{"countries": {}}',
        )
      end

      before do
        allow(mock_response).to receive(:each_header).and_yield('content-type', 'application/json')
        allow_any_instance_of(Net::HTTP).to receive(:request).and_return(mock_response)
      end

      it 'proxies /api/country-support to Next.js' do
        env = Rack::MockRequest.env_for('/api/country-support')
        status, headers, body = middleware.call(env)

        expect(status).to eq(200)
        expect(headers['content-type']).to eq('application/json')
        expect(body.first).to eq('{"countries": {}}')
      end

      it 'proxies /api/openid-connect/certs to Next.js' do
        env = Rack::MockRequest.env_for('/api/openid-connect/certs')
        status, _headers, body = middleware.call(env)

        expect(status).to eq(200)
        expect(body.first).to eq('{"countries": {}}')
      end
    end

    describe 'for non-proxied routes' do
      it 'passes through to Rails' do
        env = Rack::MockRequest.env_for('/users/sign_in')
        status, _headers, body = middleware.call(env)

        expect(status).to eq(200)
        expect(body).to eq(['Rails response'])
      end
    end

    describe 'when Next.js is unavailable' do
      before do
        allow_any_instance_of(Net::HTTP).to receive(:request).and_raise(
          Errno::ECONNREFUSED,
        )
      end

      it 'falls back to Rails' do
        env = Rack::MockRequest.env_for('/api/country-support')
        status, _headers, body = middleware.call(env)

        expect(status).to eq(200)
        expect(body).to eq(['Rails response'])
      end
    end
  end

  describe 'with custom proxy routes' do
    before do
      allow(ENV).to receive(:fetch).with('NEXT_JS_PROXY_ENABLED', 'false').and_return('true')
      allow(ENV).to receive(:fetch).with('NEXT_JS_URL', anything).and_return('http://localhost:3001')
      allow(ENV).to receive(:[]).with('NEXT_JS_PROXY_ROUTES').and_return('/api/custom,/api/other')
    end

    it 'only proxies configured routes' do
      env = Rack::MockRequest.env_for('/api/country-support')
      status, _headers, body = middleware.call(env)

      # Should fall through to Rails since /api/country-support is not in custom routes
      expect(status).to eq(200)
      expect(body).to eq(['Rails response'])
    end
  end

  describe 'request forwarding' do
    let(:mock_response) do
      instance_double(
        Net::HTTPResponse,
        code: '200',
        body: '{}',
      )
    end

    before do
      allow(ENV).to receive(:fetch).with('NEXT_JS_PROXY_ENABLED', 'false').and_return('true')
      allow(ENV).to receive(:fetch).with('NEXT_JS_URL', anything).and_return('http://localhost:3001')
      allow(ENV).to receive(:[]).with('NEXT_JS_PROXY_ROUTES').and_return(nil)
      allow(mock_response).to receive(:each_header).and_yield('content-type', 'application/json')
      allow_any_instance_of(Net::HTTP).to receive(:request).and_return(mock_response)
    end

    it 'forwards query parameters' do
      env = Rack::MockRequest.env_for('/api/country-support?locale=es')
      _status, _headers, _body = middleware.call(env)

      expect_any_instance_of(Net::HTTP).to have_received(:request) do |req|
        expect(req.path).to include('locale=es')
      end
    end

    it 'forwards Accept-Language header' do
      env = Rack::MockRequest.env_for(
        '/api/country-support',
        'HTTP_ACCEPT_LANGUAGE' => 'es-ES,es;q=0.9',
      )
      _status, _headers, _body = middleware.call(env)

      expect_any_instance_of(Net::HTTP).to have_received(:request) do |req|
        expect(req['Accept-Language']).to eq('es-ES,es;q=0.9')
      end
    end
  end
end
