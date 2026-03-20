# frozen_string_literal: true

class AssetSources
  attr_reader :manifest_path
  attr_reader :manifest
  attr_reader :cache_manifest

  def initialize(manifest_path:, cache_manifest:, i18n_locales:)
    @manifest_path = manifest_path
    @cache_manifest = cache_manifest
    @regexp_locale_suffix = %r{\.(#{i18n_locales.join('|')})\.js$}

    if cache_manifest
      @manifest = read_manifest.freeze
    end
  end

  def get_sources(*names)
    # RailsI18nPlugin generates additional assets suffixed per locale, e.g. `.fr.js`.
    # This method filters to only include the current locale's JS files.

    load_manifest_if_needed

    locale_sources, sources = names.flat_map do |name|
      get_js_sources_for_entry(name) || begin
        [name] if name.match?(URI::ABS_URI)
      end
    end.uniq.compact.partition { |source| @regexp_locale_suffix.match?(source) }

    [
      *locale_sources.filter { |source| source.end_with? ".#{I18n.locale}.js" },
      *sources,
    ]
  end

  def get_assets(*names)
    load_manifest_if_needed

    names.flat_map do |name|
      get_non_js_assets_for_entry(name)
    end.uniq.compact
  end

  def get_integrity(path)
    load_manifest_if_needed

    # Try Vite format first (vite-plugin-manifest-sri adds integrity to entries)
    # Then fall back to webpack format (integrity hash in separate key)
    manifest&.dig(path, 'integrity') || manifest&.dig('integrity', path)
  end

  def read_manifest
    return nil if manifest_path.nil?

    begin
      JSON.parse(File.read(manifest_path))
    rescue JSON::ParserError, Errno::ENOENT
      nil
    end
  end

  def load_manifest
    @manifest = read_manifest
  end

  private

  def load_manifest_if_needed
    load_manifest if !manifest || !cache_manifest
  end

  # Detects manifest format and extracts JS sources appropriately
  def get_js_sources_for_entry(name)
    return nil unless manifest

    # Try webpack format first: { entrypoints: { name: { assets: { js: [...] } } } }
    if manifest.key?('entrypoints')
      return manifest.dig('entrypoints', name, 'assets', 'js')
    end

    # Vite format: each entry is keyed by source path
    # e.g. { "app/javascript/packs/application.ts": { file: "...", ... } }
    entry_key = find_vite_entry_key(name)
    return nil unless entry_key

    entry = manifest[entry_key]
    return nil unless entry

    # Collect the main file and any imports
    sources = []
    sources << "/packs/#{entry['file']}" if entry['file']

    # Include imported chunks
    if entry['imports']
      entry['imports'].each do |import_key|
        import_entry = manifest[import_key]
        sources << "/packs/#{import_entry['file']}" if import_entry&.dig('file')
      end
    end

    # Include dynamically imported chunks
    if entry['dynamicImports']
      entry['dynamicImports'].each do |import_key|
        import_entry = manifest[import_key]
        sources << "/packs/#{import_entry['file']}" if import_entry&.dig('file')
      end
    end

    # Look for locale-specific files based on the main entry file
    # Vite i18n plugin generates files like: document-capture.tsx-hash.digested-hash.en.js
    if entry['file']
      main_file_base = entry['file'].sub(/\.js$/, '')
      locale_dir = File.dirname(File.join(Rails.public_path, 'packs', entry['file']))
      if Dir.exist?(locale_dir)
        Dir.glob(File.join(locale_dir, "#{File.basename(main_file_base)}*.*.js")).each do |locale_file|
          # Only include if it matches locale pattern (e.g., .en.js, .es.js)
          if locale_file =~ /\.[a-z]{2}\.js$/
            relative_path = locale_file.sub(Rails.public_path.to_s, '')
            sources << relative_path
          end
        end
      end
    end

    sources.presence
  end

  # Find the Vite manifest entry key for a given entrypoint name
  def find_vite_entry_key(name)
    return nil unless manifest

    # Try exact match first - Vite Ruby uses paths relative to sourceCodeDir
    possible_keys = [
      "packs/#{name}.ts",
      "packs/#{name}.tsx",
      "packs/#{name}.js",
      "packs/#{name}.jsx",
      "../components/#{name}.ts",
      "../components/#{name}.tsx",
      # Also try the full paths for backwards compat
      "app/javascript/packs/#{name}.ts",
      "app/javascript/packs/#{name}.tsx",
      "app/components/#{name}.ts",
      "app/components/#{name}.tsx",
      name,
    ]

    possible_keys.each do |key|
      return key if manifest.key?(key) && manifest[key]['isEntry']
    end

    # Try finding by entry name in manifest values
    manifest.each do |key, value|
      return key if value.is_a?(Hash) && value['isEntry'] && value['name'] == name
    end

    nil
  end

  # Extract non-JS assets (CSS, etc.) for an entry
  def get_non_js_assets_for_entry(name)
    return nil unless manifest

    # Webpack format
    if manifest.key?('entrypoints')
      return manifest.dig('entrypoints', name, 'assets')&.except('js')&.values&.flatten
    end

    # Vite format
    entry_key = find_vite_entry_key(name)
    return nil unless entry_key

    entry = manifest[entry_key]
    return nil unless entry

    assets = []

    # CSS files
    if entry['css']
      entry['css'].each do |css_file|
        assets << css_file
      end
    end

    # Assets from imports
    if entry['imports']
      entry['imports'].each do |import_key|
        import_entry = manifest[import_key]
        if import_entry&.dig('css')
          import_entry['css'].each do |css_file|
            assets << css_file
          end
        end
      end
    end

    assets.presence
  end
end
