const { withAndroidManifest } = require("expo/config-plugins");

// Camera ships barcode_ui and background removal ships subject_segment.
// The manifest merger rejects two values for the same meta-data name, so the
// app declares both and replaces the library copies.
const NAME = "com.google.mlkit.vision.DEPENDENCIES";
const VALUE = "barcode_ui,subject_segment";

function withMlkitModels(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    const app = manifest.application[0];
    app["meta-data"] ??= [];
    const entry = app["meta-data"].find((item) => item.$["android:name"] === NAME);
    const attrs = {
      "android:name": NAME,
      "android:value": VALUE,
      "tools:replace": "android:value",
    };
    if (entry) Object.assign(entry.$, attrs);
    else app["meta-data"].push({ $: attrs });
    return config;
  });
}

module.exports = withMlkitModels;
