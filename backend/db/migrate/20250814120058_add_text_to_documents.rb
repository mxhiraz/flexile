class AddTextToDocuments < ActiveRecord::Migration[8.0]
  def change
    add_column :documents, :text, :string
  end
end
