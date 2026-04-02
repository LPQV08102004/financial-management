package com.cnlthd.user.repository;

import com.cnlthd.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

  Optional<User> findByEmail(String email);

  boolean existsByEmail(String email);

  Optional<User> findByIdAndDeletedAtIsNull(String id);

  Optional<User> findByEmailAndDeletedAtIsNull(String email);
}
