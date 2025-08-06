class UpdateLetterOfTransmittalContent < ActiveRecord::Migration[8.0]
  def up
    html_file_path = Rails.root.join('public', 'LetterOfTransmissal.html')

    if File.exist?(html_file_path)
      letter_content = File.read(html_file_path)

      TenderOffer.joins(:company)
                 .where(companies: { is_gumroad: true })
                 .update_all(letter_of_transmittal: letter_content)
    else
      Rails.logger.warn "LetterOfTransmissal.html file not found at #{html_file_path}"
    end
  end

  def down
    TenderOffer.joins(:company)
               .where(companies: { is_gumroad: true })
               .update_all(letter_of_transmittal: nil)
  end
end
