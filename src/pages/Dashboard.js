// File: src/pages/Dashboard.js
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { getRatingStats } from "../services/TicketService";
import "./Dashboard.scss"; // Import SCSS mới

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const user = useSelector((state) => state.user);
  const [stats, setStats] = useState({
    averageRating: 0,
    ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    comments: [],
  });
  const [currentPage, setCurrentPage] = useState(1); // State cho trang hiện tại
  const commentsPerPage = 5; // Số bình luận mỗi trang

  useEffect(() => {
    if (user) {
      // Fetch dữ liệu cho tất cả roles, server sẽ lọc
      getRatingStats({
        success: (data) => setStats(data),
        error: (err) => console.error(err),
      });
    }
  }, [user]);

  if (!user) return <Navigate to="/login" />;

  const pieData = {
    labels: ["1 Sao", "2 Sao", "3 Sao", "4 Sao", "5 Sao"],
    datasets: [
      {
        data: [
          stats.ratingCounts[1],
          stats.ratingCounts[2],
          stats.ratingCounts[3],
          stats.ratingCounts[4],
          stats.ratingCounts[5],
        ],
        backgroundColor: [
          "#FF6384",
          "#FFCE56",
          "#36A2EB",
          "#4BC0C0",
          "#9966FF",
        ],
      },
    ],
  };

  const totalRatings = Object.values(stats.ratingCounts).reduce(
    (a, b) => a + b,
    0
  );
  const maxCount = Math.max(...Object.values(stats.ratingCounts), 1); // Avoid division by zero

  // Tính toán số trang tổng và bình luận cho trang hiện tại
  const totalPages = Math.ceil(stats.comments.length / commentsPerPage);
  const paginatedComments = stats.comments.slice(
    (currentPage - 1) * commentsPerPage,
    currentPage * commentsPerPage
  );

  // Hàm xử lý chuyển trang
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Chào mừng, {user.accountName}</h2>
      <p>
        Role:{" "}
        {user.roleID === 1
          ? "Khách hàng"
          : user.roleID === 2
          ? "Admin"
          : "Hỗ trợ viên"}
      </p>
      <div className="stats-section">
        {" "}
        {/* Luôn hiển thị, dữ liệu lọc ở server */}
        <h3>Thống kê đánh giá</h3>
        <div className="stats-row">
          <div className="pie-chart">
            <Pie data={pieData} options={{ responsive: true }} />
            <p>Trung bình rating: {stats.averageRating.toFixed(2)} sao</p>
          </div>
          <div className="rating-distribution">
            <h4>Phân bố sao:</h4>
            <div className="distribution-bars">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="bar-row">
                  <span className="stars">{"★".repeat(star)}</span>
                  <div className="bar-container">
                    <div
                      className="bar"
                      style={{
                        width: `${
                          (stats.ratingCounts[star] / maxCount) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="count">({stats.ratingCounts[star]})</span>
                </div>
              ))}
            </div>
            <p className="total-ratings">{totalRatings} Người xếp hạng</p>
          </div>
        </div>
        <div className="comments-list">
          <h4>Danh sách bình luận:</h4>
          <ul>
            {paginatedComments.map((comment, index) => (
              <li key={index}>
                <div className="comment-header">
                  Ticket #{comment.ticketID} - {comment.ratingPoint} Sao
                </div>
                <div className="comment-body">
                  "{comment.ratingDescription}"
                </div>
                <div className="comment-footer">Từ: {comment.customerName}</div>
              </li>
            ))}
          </ul>
          {totalPages > 1 && ( // Hiển thị phân trang chỉ khi có nhiều hơn 1 trang
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Trang trước
              </button>
              <span>
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Trang sau
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
