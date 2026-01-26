/**
 * フロントエンドから送られた画像データをGoogleドライブに保存し、表示用URLを返します。
 * 
 * @param {string} base64Data - 画像のBase64文字列（プレフィックスなし）
 * @param {string} mimeType - MIMEタイプ (例: "image/png")
 * @param {string} fileName - 保存するファイル名
 * @return {object} - 保存結果とURL
 */
function uploadImage(base64Data, mimeType, fileName) {
  try {
    // 保存先のフォルダIDを指定してください。空の場合はマイドライブ直下に保存されます。
    var folderId = "YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE";
    var folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();

    // Base64をバイナリにデコードしてBlobを作成
    var decodedData = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decodedData, mimeType, fileName || "upload_" + new Date().getTime());

    // ファイルを作成
    var file = folder.createFile(blob);
    
    // 重要：誰でも閲覧可能な権限を設定
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // サムネイルURLを生成 (sz=w1000 で十分な解像度を確保、直リンクより表示が速い)
    var fileId = file.getId();
    var thumbUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1000";

    return {
      success: true,
      url: thumbUrl,
      fileId: fileId
    };
  } catch (e) {
    return {
      success: false,
      error: e.toString()
    };
  }
}

/**
 * ウェブアプリとしてデプロイした場合のPOSTハンドラ (fetchを使用する場合)
 */
function doPost(e) {
  var params = JSON.parse(e.postData.contents);
  var result = uploadImage(params.base64Data, params.mimeType, params.fileName);
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
