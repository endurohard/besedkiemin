import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class PinLoginDto {
  @ApiProperty({ example: "1234", description: "4-значный PIN-код работника" })
  @IsString()
  @IsNotEmpty()
  @Length(4, 6)
  pin: string;
}
