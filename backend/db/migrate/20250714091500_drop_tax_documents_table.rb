# frozen_string_literal: true

# db/migrate/20250714091500_drop_tax_documents_table.rb
class DropTaxDocumentsTable < ActiveRecord::Migration[8.0]
  def up
    # Drop the table and the enum type if they still exist
    drop_table :tax_documents, if_exists: true
    drop_enum :tax_documents_status, if_exists: true
  end

  def down
    # Recreate the enum and table structure (data cannot be restored)
    create_enum :tax_documents_status, %w[initialized submitted deleted]

    create_table :tax_documents do |t|
      t.string :name, null: false
      t.integer :tax_year, null: false
      t.enum :status, enum_type: :tax_documents_status, null: false, default: "initialized", index: true
      t.datetime :submitted_at
      t.datetime :emailed_at
      t.datetime :deleted_at
      t.references :user_compliance_info, null: false
      t.references :company, null: false

      t.index %i[name tax_year user_compliance_info_id], unique: true, where: "status != 'deleted'"

      t.timestamps
    end
  end
end
