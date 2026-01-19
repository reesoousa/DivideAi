import { useState } from "react";
import { Group } from "@/types/expense";

const groupColors = [
  "bg-primary",
  "bg-secondary",
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-4",
  "bg-chart-5",
];

const groupIcons = ["🏠", "✈️", "🎉", "💼", "🍽️", "🎮", "🏖️", "🚗"];

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const addGroup = (name: string, description?: string) => {
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name,
      description,
      icon: groupIcons[groups.length % groupIcons.length],
      color: groupColors[groups.length % groupColors.length],
      createdAt: new Date(),
    };
    setGroups([...groups, newGroup]);
    return newGroup.id;
  };

  const removeGroup = (id: string) => {
    setGroups(groups.filter((g) => g.id !== id));
    if (selectedGroupId === id) {
      setSelectedGroupId(null);
    }
  };

  const updateGroup = (id: string, updates: Partial<Group>) => {
    setGroups(groups.map((g) => 
      g.id === id ? { ...g, ...updates } : g
    ));
  };

  const selectGroup = (id: string) => {
    setSelectedGroupId(id);
  };

  const deselectGroup = () => {
    setSelectedGroupId(null);
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return {
    groups,
    selectedGroupId,
    selectedGroup,
    addGroup,
    removeGroup,
    updateGroup,
    selectGroup,
    deselectGroup,
  };
}
