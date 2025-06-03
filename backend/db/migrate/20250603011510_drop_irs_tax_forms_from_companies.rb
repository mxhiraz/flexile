class DropIrsTaxFormsFromCompanies < ActiveRecord::Migration[7.2]
  def change
    remove_column :companies, :irs_tax_forms, :boolean if column_exists?(:companies, :irs_tax_forms)
  end
end
