class CreateNewDocumentSignatures < ActiveRecord::Migration[8.0]
  def change
    create_join_table :documents, :users, table_name: :document_signatures do |t|
      t.timestamps
    end
  end
end
