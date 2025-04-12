package com.example.booking.reservation;

import com.example.booking.reservation.Reservation;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReservationRepository extends ReactiveMongoRepository<Reservation, String> {
}
