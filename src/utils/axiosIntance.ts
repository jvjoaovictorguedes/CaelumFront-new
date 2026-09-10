import axios from "axios";
import { MockApiClient } from "./mock-api";

const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

const axiosInstance = useMocks
  ? new MockApiClient()
  : axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
      timeout: 5000,
    });

export default axiosInstance;
