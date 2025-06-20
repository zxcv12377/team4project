package com.example.server.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@EnableRabbit
@Configuration
public class RabbitMQConfig {
    // ==== Presence ====
    public static final String PRESENCE_EXCHANGE = "presence.fanout";
    public static final String PRESENCE_QUEUE = "presence.queue";

    @Bean
    public FanoutExchange presenceExchange() {
        return new FanoutExchange(PRESENCE_EXCHANGE, true, false);
    }

    @Bean
    public Queue presenceQueue() {
        return QueueBuilder.durable(PRESENCE_QUEUE).build();
    }

    @Bean
    public Binding presenceBinding(Queue presenceQueue, FanoutExchange presenceExchange) {
        return BindingBuilder.bind(presenceQueue).to(presenceExchange);
    }

    // ==== Friend ====
    public static final String FRIEND_EVENT_EXCHANGE = "friend.event.exchange";
    public static final String FRIEND_EVENT_QUEUE = "friend.event.queue";

    @Bean
    public FanoutExchange friendEventExchange() {
        return new FanoutExchange(FRIEND_EVENT_EXCHANGE, true, false);
    }

    @Bean
    public Queue friendEventQueue() {
        return QueueBuilder.durable(FRIEND_EVENT_QUEUE).build();
    }

    @Bean
    public Binding friendEventBinding(Queue friendEventQueue, FanoutExchange friendEventExchange) {
        return BindingBuilder.bind(friendEventQueue).to(friendEventExchange);
    }

    // 공통
    @Bean
    public Jackson2JsonMessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, Jackson2JsonMessageConverter converter) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(converter);
        return rabbitTemplate;
    }

    @Bean(name = "rabbitListenerContainerFactory") // 기본 이름으로 덮어쓰기
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            Jackson2JsonMessageConverter converter) {

        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(converter);
        return factory;
    }
}
