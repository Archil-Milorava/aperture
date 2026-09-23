// Its own file so kafka.module.ts and kafka-producer.service.ts can both
// import it without importing each other (that circular import previously
// crashed Nest's module scanner with a CircularDependencyException).
export const KAFKA_CLIENT = 'KAFKA_CLIENT';
