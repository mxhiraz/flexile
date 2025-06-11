class DropCapTableUploads < ActiveRecord::Migration[7.2]
  def change
    drop_table :cap_table_uploads do |t|
      t.bigint "company_id", null: false
      t.bigint "user_id", null: false
      t.datetime "uploaded_at", null: false
      t.string "status", null: false
      t.datetime "created_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
      t.datetime "updated_at", null: false
      t.jsonb "parsed_data"
      t.string "external_id", null: false
      t.index ["company_id"], name: "index_cap_table_uploads_on_company_id"
      t.index ["external_id"], name: "index_cap_table_uploads_on_external_id", unique: true
      t.index ["user_id"], name: "index_cap_table_uploads_on_user_id"
    end
  end
end
