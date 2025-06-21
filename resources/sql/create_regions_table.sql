CREATE TABLE IF NOT EXISTS regions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT,
  name VARCHAR(255),
  FOREIGN KEY (owner_id) REFERENCES players(id)
);
