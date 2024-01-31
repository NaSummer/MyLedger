<?php
session_start();
header('Content-Type: application/json');
include 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // ユーザーログイン状態を確認
    if (!isset($_SESSION['userid'])) {
        echo json_encode(["error" => "ログインしていません"]);
        exit;
    }
    
    $user_id = $_SESSION['userid']; // 获取当前登录用户的ID
    $type = $_POST['type'];
    $amount = $_POST['amount'];
    $currency_id = $_POST['currency_id'];
    $happened_at = $_POST['happened_at']; // UNIXTIME Seconds
    $memo = $_POST['memo'];

    // 验证输入数据的合法性
    if (empty($type) || empty($amount) || empty($currency_id) || empty($happened_at)) {
        echo json_encode(["success" => false, "message" => "缺少必要的输入数据"]);
        exit;
    }

    // 预处理和绑定参数
    $stmt = $conn->prepare("INSERT INTO transactions (user_id, type, amount, currency_id, happened_at, description) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isdiis", $user_id, $type, $amount, $currency_id, $happened_at, $memo);

    // 执行并检查是否成功
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "记账成功"]);
    } else {
        echo json_encode(["success" => false, "message" => "记账失败: " . $stmt->error]);
    }

    $stmt->close();
    $conn->close();
} else {
    echo json_encode(["success" => false, "message" => "无效的请求"]);
}
?>
