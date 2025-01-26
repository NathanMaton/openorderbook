// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract OrderBook is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _orderIds;

    struct Order {
        uint256 id;
        address maker;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        bool active;
        uint256 timestamp;
    }

    // Mapping from orderId to Order
    mapping(uint256 => Order) public orders;
    
    // Events
    event OrderCreated(
        uint256 indexed orderId,
        address indexed maker,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event OrderFilled(
        uint256 indexed orderId,
        address indexed maker,
        address indexed taker,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event OrderCancelled(uint256 indexed orderId, address indexed maker);

    constructor() {}

    function createOrder(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) external nonReentrant returns (uint256) {
        require(tokenIn != address(0), "Invalid token in");
        require(tokenOut != address(0), "Invalid token out");
        require(amountIn > 0, "Invalid amount in");
        require(amountOut > 0, "Invalid amount out");

        // Transfer tokens to contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Create order
        _orderIds.increment();
        uint256 orderId = _orderIds.current();
        
        orders[orderId] = Order({
            id: orderId,
            maker: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: amountOut,
            active: true,
            timestamp: block.timestamp
        });

        emit OrderCreated(orderId, msg.sender, tokenIn, tokenOut, amountIn, amountOut);
        return orderId;
    }

    function fillOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.active, "Order not active");
        require(order.maker != msg.sender, "Cannot fill own order");

        // Transfer tokens from taker to maker
        IERC20(order.tokenOut).transferFrom(msg.sender, order.maker, order.amountOut);
        
        // Transfer tokens from contract to taker
        IERC20(order.tokenIn).transfer(msg.sender, order.amountIn);

        // Mark order as filled
        order.active = false;

        emit OrderFilled(
            orderId,
            order.maker,
            msg.sender,
            order.tokenIn,
            order.tokenOut,
            order.amountIn,
            order.amountOut
        );
    }

    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.active, "Order not active");
        require(order.maker == msg.sender, "Not order maker");

        // Return tokens to maker
        IERC20(order.tokenIn).transfer(msg.sender, order.amountIn);

        // Mark order as inactive
        order.active = false;

        emit OrderCancelled(orderId, msg.sender);
    }

    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }
}
