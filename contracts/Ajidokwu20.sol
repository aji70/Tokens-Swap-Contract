// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Ajidokwu20 is ERC20, Ownable {
    
    constructor(address initialOwner)
        ERC20("Ajidokwu20", "A20")
        Ownable(initialOwner)
    {
        _mint(msg.sender, 50000000 * 10 ** 18);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
