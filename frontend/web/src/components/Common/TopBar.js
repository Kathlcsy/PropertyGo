import React, { useState, useEffect } from "react";
import "./styles/Topbar.css";
import { IoMdNotificationsOutline, IoIosLogOut } from "react-icons/io";
import { MdNotificationImportant } from "react-icons/md";
import socketIOClient from "socket.io-client";
import { Toast, Row, Col } from "react-bootstrap";
import API from "../../services/API";

const TopBar = () => {
  const [notificationIcon, setNotificationIcon] = useState(
    "IoMdNotificationsOutline"
  );
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [admin, setAdmin] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await API.get(
          `http://localhost:3000/admins/${localStorage.getItem(
            "loggedInAdmin"
          )}`
        );

        console.log(response.data);
        setAdmin(response.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  // toast message
  const [show, setShow] = useState(false);

  const imageBasePath =
    window.location.protocol + "//" + window.location.host + "/images/";

  const handleLogout = () => {
    localStorage.removeItem("loggedInAdmin");
    window.location.reload();
    setTimeout(() => {
      window.location.href = "/";
    }, 0);
  };

  const handleAvailableNotification = () => {
    const anyUnread = notifications.some(
      (notification) => !notification.isRead
    );
    setNotificationIcon(
      anyUnread ? "MdNotificationImportant" : "IoMdNotificationsOutline"
    );
    setShowNotifications(!showNotifications);
  };

  const markNotificationAsRead = async (notificationId) => {
    const updatedNotifications = notifications.filter((notification) => {
      return notification.notificationId !== notificationId;
    });

    await API.patch(`/admin/notifications/markAsRead/${notificationId}`);

    setNotifications(updatedNotifications);

    if (updatedNotifications.length === 0) {
      setNotificationIcon("IoMdNotificationsOutline");
    }
  };

  const handleEmptyNotification = () => {
    displayNotification();
  };

  const handleMarkAllAsRead = async () => {
    await API.patch(`/admin/notifications/markAllAsRead`, {
      notifications: notifications,
    });

    setNotifications([]);
    setNotificationIcon("IoMdNotificationsOutline");
  };

  const displayNotification = () => {
    setShowNotifications(!showNotifications);
  };

  const fetchData = async () => {
    try {
      const response = await API.get(`/admin/notifications`);
      const notifications = response.data.notifications;

      const today = new Date().toDateString();

      const adminNotifications = notifications.filter((notification) => {
        return (
          notification.adminId == localStorage.getItem("loggedInAdmin") ||
          (notification.userId !== null && notification.adminId === null)
        );
      });

      const filteredNotifications = adminNotifications
        .filter((notification) => {
          const createdAtDate = new Date(notification.createdAt).toDateString();
          return createdAtDate === today;
        })
        .filter((notification) => {
          return notification.hasRead !== true;
        })
        .sort((a, b) => {
          const timestampA = new Date(a.createdAt).getTime();
          const timestampB = new Date(b.createdAt).getTime();
          return timestampB - timestampA;
        });

      setNotifications(filteredNotifications);

      const allRead = filteredNotifications.every(
        (notification) => notification.hasRead === true
      );

      setNotificationIcon(
        allRead ? "IoMdNotificationsOutline" : "MdNotificationImportant"
      );
    } catch (error) {
      console.error(error);
    }
  };

  const showToast = () => {
    setShow(true);
  };

  useEffect(() => {
    const socket = socketIOClient("http://localhost:3000");

    socket.on("newContactUsNotification", () => {
      showToast();
      fetchData();
    });

    socket.on("newPartnerApplicationNotification", () => {
      showToast();
      fetchData();
    });

    socket.on("newFlaggedForumTopicNotification", () => {
      showToast();
      fetchData();
    });

    socket.on("newRemoveFlaggedForumTopicNotification", () => {
      showToast();
      fetchData();
    });

    socket.on("newAcceptPartnerApplicationNotification", () => {
      fetchData();
    });

    socket.on("newRejectPartnerApplicationNotification", () => {
      fetchData();
    });

    socket.on("newAdminFlaggedForumTopic", () => {
      fetchData();
    });

    socket.on("newAdminResetAppropriateForumTopic", () => {
      fetchData();
    });

    socket.on("newFlaggedForumPostNotification", () => {
      showToast();
      fetchData();
    });

    socket.on("newRemoveFlaggedForumPostNotification", () => {
      showToast();
      fetchData();
    });

    socket.on("newAdminFlaggedForumPost", () => {
      fetchData();
    });

    socket.on("newAdminResetAppropriateForumPost", () => {
      fetchData();
    });

    socket.on("newFlaggedForumCommentNotification", () => {
      showToast();
      fetchData();
    });

    socket.on("newRemoveFlaggedForumCommentNotification", () => {
      showToast();
      fetchData();
    });

    socket.on("newAdminFlaggedForumComment", () => {
      fetchData();
    });

    socket.on("newAdminResetAppropriateForumComment", () => {
      fetchData();
    });

    fetchData();

    return () => {
      socket.disconnect();
    };
  }, []);

  const formatRelativeTime = (createdAt) => {
    const now = new Date();
    const diffInMilliseconds = now - new Date(createdAt);

    const seconds = Math.floor(diffInMilliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else {
      return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
    }
  };

  const notificationsContent =
    notifications.length > 0 ? (
      notifications
        .filter((notification) => !notification.isRead)
        .map((notification, index) => (
          <div key={index} className="notification-item">
            <div className="notification-content">
              <p>{notification.content}</p>
              <span className="notification-time">
                {formatRelativeTime(notification.createdAt)}
              </span>
            </div>
            <div className="mark-as-read-button">
              <button
                onClick={() =>
                  markNotificationAsRead(notification.notificationId)
                }
              >
                Mark as Read
              </button>
            </div>
          </div>
        ))
    ) : (
      <div className="notification-item">
        <p>No recent notifications for today</p>
      </div>
    );

  return (
    <div className="topbar">
      <div style={{ marginTop: "8em", marginLeft: "30em" }}>
        <Row>
          <Col xs={6}>
            <Toast bg="warning" onClose={() => setShow(false)} show={show}>
              <Toast.Header>
                <strong className="me-auto">Alert</strong>
              </Toast.Header>
              <Toast.Body>{`You have new notification(s)!`}</Toast.Body>
            </Toast>
          </Col>
        </Row>
      </div>
      <div className="icons-container">
        <div className="admin-name">
          <span>
            Welcome! You are logged in as,{" "}
            <span style={{ fontWeight: "500" }}>{admin.userName}</span>
          </span>
        </div>
        {notificationIcon === "MdNotificationImportant" ? (
          <div
            className="notification-icon-container"
            onClick={handleAvailableNotification}
          >
            <MdNotificationImportant className="notif" />
            {unreadNotificationCount > 0 && (
              <div className="notification-badge">
                {unreadNotificationCount}
              </div>
            )}
          </div>
        ) : (
          <div
            className="notification-icon-container"
            onClick={handleEmptyNotification}
          >
            <IoMdNotificationsOutline className="notif" />
          </div>
        )}

        {showNotifications && (
          <div className="notifications-panel">
            <div className="notification-buttons">
              <a href="/notifications" className="view-all-link">
                View All Notifications
              </a>
              <a
                href="#"
                className="mark-read-link"
                onClick={handleMarkAllAsRead}
              >
                Mark All as Read
              </a>
            </div>
            {notificationsContent}
          </div>
        )}

        <IoIosLogOut className="notif" onClick={handleLogout} />
      </div>
    </div>
  );
};

export default TopBar;
