// DummyData.js
export const dummyChats = [
  {
    id: "1",
    otherUserName: "Alice",
    otherUserProfilePic: "https://randomuser.me/api/portraits/women/1.jpg",
    lastMessage: "Hey, how are you?",
    lastMessageTimestamp: new Date(2024, 7, 16, 10, 30).getTime(),
  },
  {
    id: "2",
    otherUserName: "Bob",
    otherUserProfilePic: "https://randomuser.me/api/portraits/men/1.jpg",
    lastMessage: "Did you see the latest movie?",
    lastMessageTimestamp: new Date(2024, 7, 16, 9, 45).getTime(),
  },
  // Add more dummy chats as needed
];

export const dummyMessages = {
  1: [
    {
      id: "1",
      sender: "other",
      content: "Hey, how are you?",
      timestamp: new Date(2024, 7, 16, 10, 30).getTime(),
    },
    {
      id: "2",
      sender: "me",
      content: "I'm good, thanks! How about you?",
      timestamp: new Date(2024, 7, 16, 10, 31).getTime(),
    },
  ],
  2: [
    {
      id: "1",
      sender: "other",
      content: "Did you see the latest movie?",
      timestamp: new Date(2024, 7, 16, 9, 45).getTime(),
    },
    {
      id: "2",
      sender: "me",
      content: "Not yet, is it good?",
      timestamp: new Date(2024, 7, 16, 9, 46).getTime(),
    },
  ],
  // Add more messages for other chats
};
