import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Meeting, NewMeeting } from '../models/models';
import { API_BASE_URL } from '../constants';

@Injectable({ providedIn: 'root' })
export class MeetingService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/meetings`;

  /**
   * Fetch meetings for a specific date (and optionally a room).
   * Filtering is done server-side via JSON Server query params.
   * Rationale: avoids loading all meetings into memory; keeps the
   * payload small when the dataset grows.
   */
  getByDate(date: string, roomId?: string): Observable<Meeting[]> {
    let params = new HttpParams().set('date', date).set('_sort', 'startTime');
    if (roomId) params = params.set('roomId', roomId);
    return this.http.get<Meeting[]>(this.base, { params });
  }

  getById(id: string): Observable<Meeting> {
    return this.http.get<Meeting>(`${this.base}/${id}`);
  }

  /**
   * For conflict checking we need all meetings for a room+date regardless
   * of current filter, so we fetch them separately.
   */
  getByRoomAndDate(roomId: string, date: string): Observable<Meeting[]> {
    const params = new HttpParams().set('roomId', roomId).set('date', date);
    return this.http.get<Meeting[]>(this.base, { params });
  }

  create(data: NewMeeting): Observable<Meeting> {
    return this.http.post<Meeting>(this.base, data);
  }

  update(id: string, data: NewMeeting): Observable<Meeting> {
    return this.http.put<Meeting>(`${this.base}/${id}`, { id, ...data });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
