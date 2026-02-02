import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import HistoryList from "./HistoryList";
import ChatRoom from "../pages/ChatRoom";
import "./ChatLayout.scss";

const ChatLayout = () => {
    const { roomId: urlRoomId } = useParams();
    const navigate = useNavigate();
    const [selectedRoomId, setSelectedRoomId] = useState(urlRoomId || null);

    useEffect(() => {
        if (urlRoomId) {
            setSelectedRoomId(urlRoomId);
        } else {
            setSelectedRoomId(null);
        }
    }, [urlRoomId]);

    const handleSelectRoom = (roomId) => {
        setSelectedRoomId(roomId);
        navigate(`/chat/${roomId}`, { replace: true });
    };

    const handleBack = () => {
        setSelectedRoomId(null);
        navigate("/history", { replace: true });
    };

    const hasSelectedRoom = !!selectedRoomId;

    return (
        <div className="chat-layout">
            <div
                className={`history-panel ${hasSelectedRoom ? "history-collapsed" : "full-width"
                    }`}
            >
                <HistoryList
                    selectedRoomId={selectedRoomId}
                    onSelectRoom={handleSelectRoom}
                />
            </div>

            <div
                className={`chat-panel ${hasSelectedRoom ? "chat-expanded" : "full-width"
                    }`}
            >
                {hasSelectedRoom ? (
                    <ChatRoom
                        roomId={selectedRoomId}
                        onBack={handleBack}
                        showBackButton={true}
                    />
                ) : (
                    <div className="no-room-selected"> </div>
                )}
            </div>
        </div>
        // uia
    );
};

export default ChatLayout;