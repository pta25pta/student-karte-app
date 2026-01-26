/**
 * フロントエンドから送られた画像データをGoogleドライブに保存し、表示用URLを返します。
 */
function uploadImage(base64Data, mimeType, fileName) {
  try {
    // --- フォルダ設定 ---
    // 保存先のフォルダIDを指定してください。
    // 指定しない場合、またはIDが間違っている場合はマイドライブのルートに保存されます。
    var folderId = ""; // ここにフォルダIDを貼り付けるか、空のままにしてください
    
    var folder;
    if (folderId && folderId !== "YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE") {
      try {
        folder = DriveApp.getFolderById(folderId);
      } catch (e) {
        folder = DriveApp.getRootFolder();
      }
    } else {
      folder = DriveApp.getRootFolder();
    }

    // --- ファイル作成 ---
    // Base64をデコード（※プレフィックスがある場合は事前に除去されている想定）
    var decodedData = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decodedData, mimeType, fileName || "upload_" + new Date().getTime());

    var file = folder.createFile(blob);
    
    // 権限設定：リンクを知っている全員が閲覧可能にする
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // サムネイルURLを生成 (sz=w4000 で最大解像度を指定)
    var fileId = file.getId();
    var thumbUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w4000";

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
 * ウェブアプリとしてのエントリポイント
 */
function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var result = uploadImage(params.base64Data, params.mimeType, params.fileName);
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: e.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 疎通確認用
 */
function doGet() {
  return ContentService.createTextOutput("GAS Image Upload API is running.");
}
