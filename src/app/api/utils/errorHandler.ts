import { NextResponse } from 'next/server';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const handleError = (error: any) => {
  console.error('Error:', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.statusCode }
    );
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return NextResponse.json(
      { message: 'Invalid token' },
      { status: 401 }
    );
  }

  if (error.name === 'TokenExpiredError') {
    return NextResponse.json(
      { message: 'Token expired' },
      { status: 401 }
    );
  }

  // Handle MongoDB errors
  if (error.name === 'ValidationError') {
    return NextResponse.json(
      { message: 'Validation error', errors: error.errors },
      { status: 400 }
    );
  }

  if (error.name === 'CastError') {
    return NextResponse.json(
      { message: 'Invalid ID format' },
      { status: 400 }
    );
  }

  // Handle duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return NextResponse.json(
      { message: `${field} already exists` },
      { status: 400 }
    );
  }

  // Default error
  return NextResponse.json(
    { message: 'Internal server error' },
    { status: 500 }
  );
}; 