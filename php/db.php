<?php
$db_host = "localhost";
$db_username = "web";
$db_password = "950910";
$db_schema = "ledger_db";

// 接続作成
$conn = new mysqli($db_host, $db_username, $db_password, $db_schema);

// 接続確認
if ($conn->connect_error) {
    die("接続失敗: " . $conn->connect_error);
}
?>
