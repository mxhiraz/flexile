# frozen_string_literal: true

class OauthAccount < ApplicationRecord
  belongs_to :user

  enum :provider, {
    google: 0,
  }

  validates :provider, :provider_id, presence: true
  validates :provider, uniqueness: { scope: :provider_id }
end
