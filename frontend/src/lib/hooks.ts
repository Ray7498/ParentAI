import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Meeting, Event, Grade, Timetable, Homework, Link, Survey } from "./types";

const API = "http://127.0.0.1:8000/api";

export function useDashboardData(userId?: string) {
  return useQuery({
    queryKey: ["dashboard-full", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user ID");
      const [m, e, g, t, h, l, s] = await Promise.all([
        axios.get(`${API}/parents/${userId}/meetings`),
        axios.get(`${API}/events`),
        axios.get(`${API}/parents/${userId}/grades`),
        axios.get(`${API}/parents/${userId}/timetable`),
        axios.get(`${API}/parents/${userId}/homework`),
        axios.get(`${API}/links`),
        axios.get(`${API}/surveys`),
      ]);
      return { 
        meetings: m.data as Meeting[], 
        events: e.data as Event[], 
        grades: g.data as Grade[],
        timetable: t.data as Timetable[],
        homework: h.data as Homework[],
        links: l.data as Link[],
        surveys: s.data as Survey[]
      };
    },
    enabled: !!userId,
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => axios.delete(`${API}/meetings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-full"] });
    },
  });
}

export function useToggleHomework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hw: Homework) => axios.put(`${API}/homework/${hw.id}/status`, { is_completed: !hw.is_completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-full"] }),
  });
}
