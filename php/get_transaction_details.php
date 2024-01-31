<?php
session_start();
header('Content-Type: application/json');
include 'db.php';

if (!isset($_SESSION['userid'])) {
    echo json_encode(["success" => false, "error" => "ログインしていません"]);
    exit;
}

if (isset($_GET['id'])) {
    $transactionId = $_GET['id'];
    $userId = $_SESSION['userid'];

    // $stmt = $conn->prepare("SELECT id, type, amount, FROM_UNIXTIME(happened_at) as happened_at, description FROM transactions WHERE id = ? AND user_id = ?");
    $stmt = $conn->prepare("SELECT id, type, amount, happened_at, description FROM transactions WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $transactionId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        echo json_encode(["success" => true, "transaction" => $row]);
    } else {
        echo json_encode(["success" => false, "error" => "指定された取引が見つかりません"]);
    }
    $stmt->close();
} else {
    echo json_encode(["success" => false, "error" => "無効なリクエスト"]);
}
?>
