import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Room } from '../models/models';
import { API_BASE_URL } from '../constants';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE_URL}/rooms`;

  getAll(): Observable<Room[]> {
    return this.http.get<Room[]>(this.base);
  }
}
