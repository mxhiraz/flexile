# frozen_string_literal: true

class CreateOauthAccount < ActiveRecord::Migration[8.0]
  def change
    create_table :oauth_accounts do |t|
      t.string :provider, null: false
      t.string :provider_id, null: false
      t.references :user, null: false
      t.timestamps
    end

    add_index :oauth_accounts, [:provider, :provider_id], unique: true
  end
end
