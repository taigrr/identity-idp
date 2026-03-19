# frozen_string_literal: true

module Idv
  module DocAuthVendorConcern
    include AbTestingConcern

    def update_doc_auth_vendor(user: current_user)
      return if document_capture_session.doc_auth_vendor == Idp::Constants::Vendors::STRIPE

      document_capture_session.update!(doc_auth_vendor: Idp::Constants::Vendors::STRIPE)
    end

    private

    # @returns[String] String identifying the vendor to use for doc auth.
    def bucketed_doc_auth_vendor(user)
      Idp::Constants::Vendors::STRIPE
    end
  end
end
