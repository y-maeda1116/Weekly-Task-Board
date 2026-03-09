/**
 * Transaction Manager
 * Handles transaction management and rollback logic for import operations
 */

import { logger } from "./logger";
import { Task } from "../types/index";

export interface Transaction {
  id: string;
  operations: Operation[];
  status: "pending" | "committed" | "rolled_back";
  createdAt: Date;
  completedAt?: Date;
}

export interface Operation {
  id: string;
  type: "create_task" | "update_task" | "delete_task" | "record_sync";
  data: any;
  rollbackData?: any;
  status: "pending" | "completed" | "failed";
}

export class TransactionManager {
  private transactions: Map<string, Transaction> = new Map();
  private currentTransaction: Transaction | null = null;

  /**
   * Begin a new transaction
   */
  beginTransaction(): string {
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const transaction: Transaction = {
      id: transactionId,
      operations: [],
      status: "pending",
      createdAt: new Date()
    };

    this.transactions.set(transactionId, transaction);
    this.currentTransaction = transaction;

    logger.info("TransactionManager", "Transaction started", { transactionId });
    return transactionId;
  }

  /**
   * Add an operation to the current transaction
   */
  addOperation(
    type: Operation["type"],
    data: any,
    rollbackData?: any
  ): string {
    if (!this.currentTransaction) {
      throw new Error("No active transaction");
    }

    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const operation: Operation = {
      id: operationId,
      type,
      data,
      rollbackData,
      status: "pending"
    };

    this.currentTransaction.operations.push(operation);

    logger.debug("TransactionManager", "Operation added to transaction", {
      transactionId: this.currentTransaction.id,
      operationId,
      type
    });

    return operationId;
  }

  /**
   * Mark an operation as completed
   */
  completeOperation(operationId: string): void {
    if (!this.currentTransaction) {
      throw new Error("No active transaction");
    }

    const operation = this.currentTransaction.operations.find(op => op.id === operationId);
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`);
    }

    operation.status = "completed";

    logger.debug("TransactionManager", "Operation completed", {
      transactionId: this.currentTransaction.id,
      operationId
    });
  }

  /**
   * Mark an operation as failed
   */
  failOperation(operationId: string, error: Error): void {
    if (!this.currentTransaction) {
      throw new Error("No active transaction");
    }

    const operation = this.currentTransaction.operations.find(op => op.id === operationId);
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`);
    }

    operation.status = "failed";

    logger.error("TransactionManager", "Operation failed", {
      transactionId: this.currentTransaction.id,
      operationId,
      error: error.message
    });
  }

  /**
   * Commit the current transaction
   */
  async commitTransaction(): Promise<void> {
    if (!this.currentTransaction) {
      throw new Error("No active transaction");
    }

    const transactionId = this.currentTransaction.id;

    // Check if all operations are completed
    const allCompleted = this.currentTransaction.operations.every(op => op.status === "completed");
    
    if (!allCompleted) {
      throw new Error("Cannot commit transaction with incomplete operations");
    }

    this.currentTransaction.status = "committed";
    this.currentTransaction.completedAt = new Date();

    logger.info("TransactionManager", "Transaction committed", {
      transactionId,
      operationCount: this.currentTransaction.operations.length
    });

    this.currentTransaction = null;
  }

  /**
   * Rollback the current transaction
   */
  async rollbackTransaction(): Promise<void> {
    if (!this.currentTransaction) {
      throw new Error("No active transaction");
    }

    const transactionId = this.currentTransaction.id;
    const operations = [...this.currentTransaction.operations].reverse();

    logger.warn("TransactionManager", "Rolling back transaction", {
      transactionId,
      operationCount: operations.length
    });

    for (const operation of operations) {
      try {
        if (operation.status === "completed" && operation.rollbackData) {
          logger.debug("TransactionManager", "Rolling back operation", {
            transactionId,
            operationId: operation.id,
            type: operation.type
          });

          // In a real implementation, this would execute the rollback
          // For now, we just log it
        }
      } catch (error) {
        logger.error("TransactionManager", "Failed to rollback operation", {
          transactionId,
          operationId: operation.id,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    this.currentTransaction.status = "rolled_back";
    this.currentTransaction.completedAt = new Date();

    logger.info("TransactionManager", "Transaction rolled back", {
      transactionId,
      operationCount: operations.length
    });

    this.currentTransaction = null;
  }

  /**
   * Get the current transaction
   */
  getCurrentTransaction(): Transaction | null {
    return this.currentTransaction;
  }

  /**
   * Get a transaction by ID
   */
  getTransaction(transactionId: string): Transaction | undefined {
    return this.transactions.get(transactionId);
  }

  /**
   * Get all transactions
   */
  getAllTransactions(): Transaction[] {
    return Array.from(this.transactions.values());
  }

  /**
   * Clear completed transactions
   */
  clearCompletedTransactions(): void {
    const completedIds: string[] = [];

    for (const [id, transaction] of this.transactions.entries()) {
      if (transaction.status !== "pending") {
        completedIds.push(id);
      }
    }

    completedIds.forEach(id => this.transactions.delete(id));

    logger.info("TransactionManager", "Cleared completed transactions", {
      count: completedIds.length
    });
  }
}

export const transactionManager = new TransactionManager();
