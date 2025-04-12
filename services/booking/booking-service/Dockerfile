FROM openjdk:17-jdk-slim as build
RUN apt-get update && apt-get install -y maven
WORKDIR /app
COPY pom.xml . 
RUN mvn dependency:go-offline
COPY src /app/src
RUN mvn clean package -DskipTests
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/booking-service-0.0.1-SNAPSHOT.jar /app/booking-service.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "booking-service.jar"]
