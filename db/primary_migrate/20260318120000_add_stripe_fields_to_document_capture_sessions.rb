# frozen_string_literal: true

class AddStripeFieldsToDocumentCaptureSessions < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  def change
    add_column :document_capture_sessions, :stripe_verification_session_id, :string
    add_column :document_capture_sessions, :stripe_last_event_id, :string

    add_index :document_capture_sessions, :stripe_verification_session_id,
              unique: true, algorithm: :concurrently,
              name: :idx_doc_capture_sessions_on_stripe_session_id
    add_index :document_capture_sessions, :stripe_last_event_id,
              algorithm: :concurrently,
              name: :idx_doc_capture_sessions_on_stripe_event_id
  end
end
