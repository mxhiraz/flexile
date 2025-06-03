class DropIrsTaxFormsFromCompanies < ActiveRecord::Migration[7.2]
  def change
    remove_column :companies, :irs_tax_forms, :boolean
  end
end
