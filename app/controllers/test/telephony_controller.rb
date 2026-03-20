# frozen_string_literal: true

module Test
  class TelephonyController < ApplicationController
    layout 'no_card'

    before_action :render_not_found_in_production

    def index
      @messages = Telephony::Test::Message.messages.reverse
      @calls = Telephony::Test::Call.calls.reverse
      @emails = load_emails
    end

    def destroy
      Telephony::Test::Message.clear_messages
      Telephony::Test::Call.clear_calls
      FileUtils.rm_rf(Rails.root.join('tmp', 'letter_opener'))
      redirect_to test_telephony_url
    end

    def destroy_email
      dir = Rails.root.join('tmp', 'letter_opener', params[:id])
      FileUtils.rm_rf(dir) if dir.exist? && dir.to_s.start_with?(Rails.root.join('tmp', 'letter_opener').to_s)
      redirect_to test_telephony_url
    end

    private

    def render_not_found_in_production
      return unless Rails.env.production?
      render_not_found
    end

    def load_emails
      dir = Rails.root.join('tmp', 'letter_opener')
      return [] unless dir.exist?

      dir.children.sort_by(&:mtime).reverse.first(20).filter_map do |entry|
        rich = entry.join('rich.html')
        next unless rich.exist?

        body = rich.read
        decoded = CGI.unescapeHTML(CGI.unescapeHTML(body))
        to = body.match(/<dt>To:<\/dt>\s*<dd>([^<]+)<\/dd>/m)&.captures&.first&.strip
        subject = body.match(/<dt>Subject:<\/dt>\s*<dd><strong>([^<]+)<\/strong><\/dd>/m)&.captures&.first
        confirm_link = decoded.match(/(http:\/\/localhost:3000\/sign_up\/email\/confirm\?[^"<]+)/m)&.captures&.first

        OpenStruct.new(
          id: entry.basename.to_s,
          to: to || 'unknown',
          subject: subject || 'Email',
          confirm_link: confirm_link,
          sent_at: entry.mtime,
        )
      end
    end
  end
end
