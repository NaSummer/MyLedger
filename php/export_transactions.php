<?php
session_start();
header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="transactions.csv"');
include 'db.php';

// ユーザーログイン状態を確認
if (!isset($_SESSION['userid'])) {
    echo "ログインしていません";
    exit;
}

$userId = $_SESSION['userid'];
$type = isset($_GET['type']) ? $_GET['type'] : 'all';

try {
    // 构建基础SQL查询
    $sql = "
        SELECT 
            FROM_UNIXTIME(happened_at) AS date
          , CASE type 
                WHEN 'income' THEN '収入'
                WHEN 'expense' THEN '支出'
                ELSE 'その他'
            END AS type
          , amount
          , (SELECT code FROM currencies WHERE currencies.id = transactions.currency_id) AS currency
          , description
        FROM transactions WHERE user_id = ? ORDER BY happened_at ASC
    ";
    $params = [$userId];

    // 添加类型筛选
    if ($type !== 'all') {
        $sql .= " AND type = ?";
        array_push($params, $type);
    }

    $stmt = $conn->prepare($sql);
    $stmt->bind_param(str_repeat("i", count($params)), ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $fp = fopen('php://output', 'w');

    // CSV头部
    $headers = ['日付', 'タイプ', '金額', '通貨', 'メモ'];
    fputcsv($fp, $headers);

    // 遍历并输出每一行
    while ($row = $result->fetch_assoc()) {
        fputcsv($fp, $row);
    }

    fclose($fp);
} catch (Exception $e) {
    echo "エラー: " . $e->getMessage();
}
?>
