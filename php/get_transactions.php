<?php
session_start();
header('Content-Type: application/json');
include 'db.php';

// ユーザーログイン状態を確認
if (!isset($_SESSION['userid'])) {
    echo json_encode(["error" => "ログインしていません"]);
    exit;
}

$userId = $_SESSION['userid'];
$type = isset($_GET['type']) ? $_GET['type'] : 'all';
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10; // 每页显示的条数
$offset = ($page - 1) * $limit;

try {
    // 计算总交易数
    $countSql = "SELECT COUNT(*) FROM transactions WHERE user_id = ?";
    $countParams = [$userId];
    $countTypes = "i"; // 初始类型字符串为user_id的类型（整数）
    // 如果类型不是'all'，则添加额外的筛选条件
    if ($type !== 'all') {
        $countSql .= " AND type = ?";
        array_push($countParams, $type);
        $countTypes .= "s"; // type是字符串类型，必须要有正确的类型标识
    }
    $countStmt = $conn->prepare($countSql);
    $countStmt->bind_param($countTypes, ...$countParams);
    $countStmt->execute();
    $totalCount = $countStmt->get_result()->fetch_row()[0];
    $totalPages = ceil($totalCount / $limit);

    // 获取当前页的交易数据
    // 构建基础SQL查询
    $sql = "
        SELECT 
            id
          , happened_at
          , amount
          , type
          , description
          , (SELECT code FROM currencies WHERE currencies.id = transactions.currency_id) AS currency
        FROM transactions WHERE user_id = ?
    ";

    $params = [$userId];
    $types = "i"; // 初始类型字符串为user_id的类型（整数）

    // 如果类型不是'all'，则添加类型筛选
    if ($type !== 'all') {
        $sql .= " AND type = ?";
        array_push($params, $type);
        $types .= "s"; // type是字符串类型，必须要有正确的类型标识
    }

    // 添加分页和排序
    $sql .= " ORDER BY happened_at ASC LIMIT ? OFFSET ?";
    array_push($params, $limit, $offset);
    $types .= "ii"; // 添加limit和offset的类型（整数）

    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $transactions = [];
    while ($row = $result->fetch_assoc()) {
        array_push($transactions, $row);
    }

    echo json_encode([
        "transactions" => $transactions,
        "totalPages" => $totalPages
        // for debug
        // ,"sql" => $countSql, "params" => $countParams, "totalCount" => $totalCount, "limit" => $limit, "offset" => $offset, "type" => $type
    ]);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>

