// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract OrderBookWithETH is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _orderIds;

    address constant public ETH_ADDRESS = address(0);

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

    // Function to create an order with ETH as payment
    function createOrderWithETH(
        address tokenOut,
        uint256 amountOut
    ) external payable nonReentrant returns (uint256) {
        require(tokenOut != ETH_ADDRESS, "Cannot exchange ETH for ETH");
        require(msg.value > 0, "Must send ETH");

        // Create order
        _orderIds.increment();
        uint256 orderId = _orderIds.current();
        
        orders[orderId] = Order({
            id: orderId,
            maker: msg.sender,
            tokenIn: ETH_ADDRESS,
            tokenOut: tokenOut,
            amountIn: msg.value,
            amountOut: amountOut,
            active: true,
            timestamp: block.timestamp
        });

        emit OrderCreated(orderId, msg.sender, ETH_ADDRESS, tokenOut, msg.value, amountOut);
        return orderId;
    }

    // Function to create an order to receive ETH
    function createOrderForETH(
        address tokenIn,
        uint256 amountIn,
        uint256 ethAmount
    ) external nonReentrant returns (uint256) {
        require(tokenIn != ETH_ADDRESS, "Cannot exchange ETH for ETH");
        require(ethAmount > 0, "Invalid ETH amount");

        // Transfer tokens to contract
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Create order
        _orderIds.increment();
        uint256 orderId = _orderIds.current();
        
        orders[orderId] = Order({
            id: orderId,
            maker: msg.sender,
            tokenIn: tokenIn,
            tokenOut: ETH_ADDRESS,
            amountIn: amountIn,
            amountOut: ethAmount,
            active: true,
            timestamp: block.timestamp
        });

        emit OrderCreated(orderId, msg.sender, tokenIn, ETH_ADDRESS, amountIn, ethAmount);
        return orderId;
    }

    // Function to fill an order
    function fillOrder(uint256 orderId) external payable nonReentrant {
        Order storage order = orders[orderId];
        require(order.active, "Order not active");
        require(order.maker != msg.sender, "Cannot fill own order");

        if (order.tokenOut == ETH_ADDRESS) {
            // Filling an order where taker pays with ETH
            require(msg.value == order.amountOut, "Incorrect ETH amount");
            
            // Transfer tokens from contract to taker
            IERC20(order.tokenIn).transfer(msg.sender, order.amountIn);
            
            // Transfer ETH to maker
            (bool sent, ) = order.maker.call{value: msg.value}("");
            require(sent, "Failed to send ETH");
        } else if (order.tokenIn == ETH_ADDRESS) {
            // Filling an order where maker paid with ETH
            // Transfer tokens from taker to maker
            IERC20(order.tokenOut).transferFrom(msg.sender, order.maker, order.amountOut);
            
            // Transfer ETH from contract to taker
            (bool sent, ) = msg.sender.call{value: order.amountIn}("");
            require(sent, "Failed to send ETH");
        }

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

    // Function to cancel an order
    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.active, "Order not active");
        require(order.maker == msg.sender, "Not order maker");

        if (order.tokenIn == ETH_ADDRESS) {
            // Return ETH to maker
            (bool sent, ) = msg.sender.call{value: order.amountIn}("");
            require(sent, "Failed to send ETH");
        } else {
            // Return tokens to maker
            IERC20(order.tokenIn).transfer(msg.sender, order.amountIn);
        }

        // Mark order as inactive
        order.active = false;

        emit OrderCancelled(orderId, msg.sender);
    }

    // Function to get order details
    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    // Function to receive ETH
    receive() external payable {}
}
