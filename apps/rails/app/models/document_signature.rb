# frozen_string_literal: true

class DocumentSignature < ApplicationRecord
  belongs_to :document
  belongs_to :user
end
