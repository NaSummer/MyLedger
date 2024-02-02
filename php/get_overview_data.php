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

try {
    // 从数据库中检索概览数据
    $query = $conn->prepare("SELECT
                                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
                                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense,
                                ( SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
                                  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) ) AS balance,
                                SUM(CASE WHEN type = 'income' AND MONTH(FROM_UNIXTIME(happened_at)) = MONTH(CURRENT_DATE) THEN amount ELSE 0 END) AS monthly_income,
                                SUM(CASE WHEN type = 'expense' AND MONTH(FROM_UNIXTIME(happened_at)) = MONTH(CURRENT_DATE) THEN amount ELSE 0 END) AS monthly_expense,
                                SUM(CASE WHEN type = 'income' AND YEARWEEK(FROM_UNIXTIME(happened_at)) = YEARWEEK(CURRENT_DATE) THEN amount ELSE 0 END) AS weekly_income,
                                SUM(CASE WHEN type = 'expense' AND YEARWEEK(FROM_UNIXTIME(happened_at)) = YEARWEEK(CURRENT_DATE) THEN amount ELSE 0 END) AS weekly_expense,
                                SUM(CASE WHEN type = 'income' AND YEAR(FROM_UNIXTIME(happened_at)) = YEAR(CURRENT_DATE) THEN amount ELSE 0 END) AS yearly_income,
                                SUM(CASE WHEN type = 'expense' AND YEAR(FROM_UNIXTIME(happened_at)) = YEAR(CURRENT_DATE) THEN amount ELSE 0 END) AS yearly_expense
                            FROM transactions
                            WHERE user_id = ?
                            ");
    $query->bind_param("i", $userId);
    $query->execute();
    $overviewData = $query->get_result()->fetch_assoc();


    // 检索本月每天的收入和支出
    $dailyQuery = $conn->prepare("SELECT 
                                    DAY(FROM_UNIXTIME(happened_at)) as day, 
                                    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS daily_income,
                                    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS daily_expense
                                  FROM transactions 
                                  WHERE 
                                      user_id = ? 
                                  AND MONTH(FROM_UNIXTIME(happened_at)) = MONTH(CURRENT_DATE) 
                                  AND YEAR(FROM_UNIXTIME(happened_at)) = YEAR(CURRENT_DATE)
                                  GROUP BY DAY(FROM_UNIXTIME(happened_at))
                                  ORDER BY DAY(FROM_UNIXTIME(happened_at))");
    $dailyQuery->bind_param("i", $userId);
    $dailyQuery->execute();
    $dailyResult = $dailyQuery->get_result();

    $dailyData = [];
    while ($row = $dailyResult->fetch_assoc()) {
        $dailyData[$row['day']] = ['daily_income' => $row['daily_income'], 'daily_expense' => $row['daily_expense']];
    }

    // // 初始化每日数据数组
    // $dailyData = array_fill(1, date('t'), ['daily_income' => 0, 'daily_expense' => 0]); // date('t') 返回当前月的天数
    // while ($row = $dailyResult->fetch_assoc()) {
    //     $dailyData[(int)$row['day']] = ['daily_income' => (float)$row['daily_income'], 'daily_expense' => (float)$row['daily_expense']];
    // }

    // 合并概览数据和每日数据
    $result = array_merge(["overview_data" => $overviewData], ["daily_data" => $dailyData]);

    echo json_encode($result);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}

?>